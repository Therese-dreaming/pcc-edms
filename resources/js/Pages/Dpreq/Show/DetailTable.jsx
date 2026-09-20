import { MICRO_LABEL } from './primitives';

// A data table that lays field label/value pairs out as rows. On small screens the label
// stacks above the value (the fixed w-52 side column collapses) so the table stays readable
// on mobile; from `sm` up it renders as the original two-column detail table.
export default function DetailTable({ rows }) {
    return (
        <table className="w-full text-left text-[0.8125rem]">
            <tbody className="divide-y divide-border">
                {rows.map((row) => (
                    <tr key={row.label} className="block align-top sm:table-row">
                        <th
                            scope="row"
                            className={`block w-full px-6 pb-0 pt-3 text-left align-top sm:table-cell sm:w-52 sm:whitespace-nowrap sm:bg-surface-tertiary/40 sm:py-3 ${MICRO_LABEL}`}
                        >
                            {row.label}
                        </th>
                        <td className="block px-6 pb-3 pt-1 font-medium leading-relaxed text-fg-primary sm:table-cell sm:py-3">
                            {row.value !== null && row.value !== undefined && row.value !== '' ? (
                                row.value
                            ) : (
                                <span className="font-normal italic text-fg-tertiary">Not specified</span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
