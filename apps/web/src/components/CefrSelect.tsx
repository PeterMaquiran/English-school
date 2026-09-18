import { CEFR_LEVELS, type CefrLevel } from '@english-school/shared';
import { Select } from '@/components/Field';

type Props = {
  value: string;
  onChange: (value: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  name?: string;
};

export function CefrSelect({
  value,
  onChange,
  allowEmpty = false,
  emptyLabel = 'None',
  name,
}: Props) {
  return (
    <Select
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {CEFR_LEVELS.map((level: CefrLevel) => (
        <option key={level} value={level}>
          {level}
        </option>
      ))}
    </Select>
  );
}
