import { useActionState } from 'react';

interface FormState {
  message: string;
  ok: boolean;
}

interface FormActionProps {
  heading: string;
  minLength: number;
}

const initialState: FormState = { message: '', ok: false };

// Server-style action runs client side here.
async function submitProfile(
  prev: FormState,
  formData: FormData
): Promise<FormState> {
  void prev;
  const name = String(formData.get('name') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();
  await new Promise((r) => setTimeout(r, 300));
  if (name.length < 2) return { message: 'Name too short.', ok: false };
  if (bio.length < 10) return { message: 'Bio needs 10+ chars.', ok: false };
  return { message: `Saved profile for ${name}.`, ok: true };
}

export function FormAction({ heading, minLength }: FormActionProps) {
  const [state, formAction, isPending] = useActionState(submitProfile, initialState);

  return (
    <section>
      <h2>{heading}</h2>
      <form action={formAction}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required minLength={2} />
        </div>
        <div>
          <label htmlFor="bio">Bio</label>
          <textarea id="bio" name="bio" required minLength={minLength} />
        </div>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save'}
        </button>
      </form>
      {state.message ? (
        <p role={state.ok ? 'status' : 'alert'}>{state.message}</p>
      ) : null}
    </section>
  );
}
