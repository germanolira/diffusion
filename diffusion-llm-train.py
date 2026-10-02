"""
Mini diffusion LLM for React/TS code. Fits RTX 2060 6GB.
Masked diffusion, char-level: train with Python+torch, collect data with TS.

  npm run collect
  pip install torch --index-url https://download.pytorch.org/whl/cu121
  python diffusion-llm-train.py --check
  python diffusion-llm-train.py --steps 2000 --batch 16 --seq 128
"""
import argparse
import json
import random


def build_vocab(text: str):
    chars = sorted(set(text))
    stoi = {c: i + 1 for i, c in enumerate(chars)}  # 0 = pad
    stoi["[MASK]"] = len(stoi) + 1
    itos = {i: c for c, i in stoi.items()}
    itos[0] = "<pad>"
    return stoi, itos


def encode(text: str, stoi: dict, seq: int):
    ids = [stoi.get(c, 0) for c in text[:seq]]
    ids += [0] * (seq - len(ids))
    return ids


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="data/code.txt")
    ap.add_argument("--seq", type=int, default=128)
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--steps", type=int, default=2000)
    ap.add_argument("--lr", type=float, default=3e-4)
    ap.add_argument("--ckpt", default="ckpt-react-diffusion.pt")
    ap.add_argument("--plot", default="loss_curve.png")
    ap.add_argument("--log", default="loss_log.csv")
    ap.add_argument("--log_every", type=int, default=20)
    ap.add_argument("--eval_every", type=int, default=100)
    ap.add_argument("--eval_ratio", type=float, default=0.3)
    ap.add_argument("--accum", type=int, default=2)
    ap.add_argument("--warmup", type=int, default=200)
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    with open(args.data, encoding="utf8") as f:
        text = f.read()
    stoi, itos = build_vocab(text)
    print(f"chars={len(text)} vocab={len(stoi)} seq={args.seq}")

    if args.check:
        ids = encode(text, stoi, args.seq)
        print(f"check ok: sample_ids={ids[:20]} mask_id={stoi['[MASK]']}")
        return

    import torch
    import torch.nn as nn

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"device={device}")
    V = len(stoi) + 1
    MASK = stoi["[MASK]"]
    d = 256

    enc_layer = nn.TransformerEncoderLayer(d, 4, 512, batch_first=True)
    model = nn.Sequential(
        nn.Embedding(V, d),
        nn.TransformerEncoder(enc_layer, 4),
        nn.Linear(d, V),
    ).to(device)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"params={n_params / 1e6:.1f}M")

    import math
    opt = torch.optim.AdamW(model.parameters(), lr=args.lr)
    loss_fn = nn.CrossEntropyLoss(ignore_index=-100)
    raw = [stoi.get(c, 0) for c in text]
    need = max(args.seq * 50, len(raw))
    tiled = (raw * ((need // len(raw)) + 1))[:need]
    cut = int(len(tiled) * 0.9)
    train_ids = tiled[:cut]
    eval_ids = tiled[cut:]
    scaler = torch.amp.GradScaler("cuda", enabled=(device == "cuda"))

    erng = random.Random(1234)
    eval_offs = [erng.randint(0, len(eval_ids) - args.seq) for _ in range(8)]
    eval_batch = torch.tensor([eval_ids[o:o + args.seq] for o in eval_offs]).to(device)
    g = torch.Generator(device=device).manual_seed(1234)
    eval_mask = (torch.rand(eval_batch.shape, generator=g, device=device) < args.eval_ratio) & (eval_batch != 0)
    eval_inp = eval_batch.clone()
    eval_inp[eval_mask] = MASK
    eval_target = torch.full_like(eval_batch, -100)
    eval_target[eval_mask] = eval_batch[eval_mask]

    def lr_at(step):
        if step < args.warmup:
            return args.lr * (step + 1) / max(args.warmup, 1)
        p = (step - args.warmup) / max(args.steps - args.warmup, 1)
        return args.lr * (0.1 + 0.9 * 0.5 * (1 + math.cos(math.pi * min(p, 1))))

    def run(x):
        return model[2](model[1](model[0](x)))

    model.train()
    history = []
    for step in range(args.steps):
        for pg in opt.param_groups:
            pg["lr"] = lr_at(step)
        opt.zero_grad()
        tot = 0.0
        for _ in range(args.accum):
            offs = [random.randint(0, len(train_ids) - args.seq) for _ in range(args.batch)]
            batch = torch.tensor([train_ids[o:o + args.seq] for o in offs]).to(device)
            ratio = random.uniform(0.15, 0.6)
            is_mask = (torch.rand_like(batch.float()) < ratio) & (batch != 0)
            inp = batch.clone()
            inp[is_mask] = MASK
            target = torch.full_like(batch, -100)
            target[is_mask] = batch[is_mask]
            with torch.amp.autocast("cuda", enabled=(device == "cuda")):
                loss = loss_fn(run(inp).reshape(-1, V), target.reshape(-1))
            tot += float(loss.item())
            scaler.scale(loss / args.accum).backward()
        scaler.unscale_(opt)
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        scaler.step(opt)
        scaler.update()
        train_loss = tot / args.accum
        ev = None
        if step % args.eval_every == 0:
            model.eval()
            with torch.no_grad():
                with torch.amp.autocast("cuda", enabled=(device == "cuda")):
                    ev = float(loss_fn(run(eval_inp).reshape(-1, V), eval_target.reshape(-1)).item())
            model.train()
            print(f"step {step} train={train_loss:.4f} eval={ev:.4f}")
        elif step % 200 == 0:
            print(f"step {step} train={train_loss:.4f}")
        if step % args.log_every == 0:
            history.append((step, round(train_loss, 4), None if ev is None else round(ev, 4)))

    torch.save({"stoi": stoi, "state": model.state_dict(), "seq": args.seq}, args.ckpt)
    print(f"saved {args.ckpt}")

    with open(args.log, "w", encoding="utf8") as f:
        f.write("step,train_loss,eval_loss\n")
        for s, t, e in history:
            f.write(f"{s},{t},{'' if e is None else e}\n")
    print(f"saved {args.log} ({len(history)} rows)")

    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    steps = [s for s, _, _ in history]
    train = [t for _, t, _ in history]
    ema = []
    m = None
    for v in train:
        m = v if m is None else 0.85 * m + 0.15 * v
        ema.append(round(m, 4))
    ev_pts = [(s, e) for s, _, e in history if e is not None]
    plt.figure()
    plt.plot(steps, train, alpha=0.25, label="train")
    plt.plot(steps, ema, label="train ema")
    if ev_pts:
        plt.plot([s for s, _ in ev_pts], [e for _, e in ev_pts], marker="o", label="eval fixed 0.3")
    plt.xlabel("step")
    plt.ylabel("loss")
    plt.title("Diffusion LLM loss (stable)")
    plt.legend()
    plt.savefig(args.plot, dpi=100, bbox_inches="tight")
    print(f"saved {args.plot}")


if __name__ == "__main__":
    main()
