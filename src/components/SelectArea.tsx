import { useApp } from "../state/AppContext";

export default function SelectArea({
  name = "area",
  valor,
  incluirGeneral = false,
}: {
  name?: string;
  valor?: string;
  incluirGeneral?: boolean;
}) {
  const { areasActivas } = useApp();
  return (
    <select name={name} defaultValue={valor ?? ""}>
      {incluirGeneral && <option value="">General</option>}
      {!incluirGeneral && <option value="">—</option>}
      {areasActivas.map((area) => (
        <option key={area.id} value={area.nombre}>
          {area.nombre}
        </option>
      ))}
    </select>
  );
}
