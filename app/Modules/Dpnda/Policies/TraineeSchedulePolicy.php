<?php

namespace App\Modules\Dpnda\Policies;

use App\Models\User;
use App\Modules\Dpnda\Models\TraineeSchedule;

// Trainee weekly schedules are self-service: only the trainee on the underlying placement may
// create/edit/delete their own whereabouts blocks. Coordinators and DPO staff get read-only
// visibility (scoped index + deployment calendar), never write access.
class TraineeSchedulePolicy
{
    public function manage(User $user, TraineeSchedule $schedule): bool
    {
        return $schedule->placement->trainee_id === $user->id;
    }
}
