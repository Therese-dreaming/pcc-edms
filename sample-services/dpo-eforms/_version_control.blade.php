@php
/**
 * DPO EFORM document version control table fragment.
 * Now reads all versions from the model's getAllVersions() method.
 *
 * Required variables:
 * @var \App\Models\DpoEform $eform
 */
$versions = $eform->getAllVersions();
@endphp

<div class="version-control-block">
    <table class="bordered">
        <thead>
            <tr>
                <th style="width: 18%;">Version Number</th>
                <th style="width: 22%;">Last Modified</th>
                <th style="width: 25%;">Created / Approved By</th>
                <th style="width: 35%;">Document Changes</th>
            </tr>
        </thead>
        <tbody>
            @foreach($versions as $v)
                <tr>
                    <td>{{ $v['number'] ?? '' }}</td>
                    <td>{{ $v['date'] ?? '' }}</td>
                    <td>{{ $v['author'] ?? '' }}</td>
                    <td>{{ $v['changes'] ?? '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
