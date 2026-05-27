import TextField from '@mui/material/TextField';

interface Props {
  expectedEmail: string;
  value: string;
  onChange: (value: string) => void;
}

export function DeletionConfirmInput({
  expectedEmail,
  value,
  onChange,
}: Props) {
  const matches = value === expectedEmail;
  const showError = value.length > 0 && !matches;

  return (
    <TextField
      fullWidth
      label={`Tapez « ${expectedEmail} » pour confirmer`}
      value={value}
      onChange={e => onChange(e.target.value)}
      error={showError}
      helperText={
        matches
          ? '✓ Email confirmé'
          : showError
            ? 'Email incorrect'
            : "L'email exact est requis pour activer l'anonymisation"
      }
      autoComplete='off'
      inputProps={{
        spellCheck: false,
        'aria-label': 'Email de confirmation',
      }}
    />
  );
}
