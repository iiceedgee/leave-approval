import { Component, Input } from '@angular/core';
import { StepperStep } from '../../models/stepper.model';

@Component({
  standalone: false,
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss']
})
export class StepperComponent {
  @Input() steps: StepperStep[] = [];

  /** @deprecated Use explicit state checks; kept for backward compat */
  isActive(step: StepperStep): boolean {
    return step.state === 'current' || step.state === 'done';
  }

  isCurrent(step: StepperStep): boolean {
    return step.state === 'current';
  }

  isDone(step: StepperStep): boolean {
    return step.state === 'done';
  }

  stateLabel(step: StepperStep): string {
    switch (step.state) {
      case 'done':      return 'ผ่านแล้ว';
      case 'current':   return 'กำลังดำเนินการ';
      case 'cancelled': return 'ยกเลิก';
      case 'rejected':  return 'ไม่อนุมัติ';
      default:          return 'รอดำเนินการ';
    }
  }
}
