import { Component, Input } from '@angular/core';
import { STATUS, getStatusThai } from '../../models/status';

@Component({
  standalone: false,
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input() statusCode = 'SU';

  get label(): string { return getStatusThai(this.statusCode); }
}
