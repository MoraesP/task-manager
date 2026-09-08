import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ALLOWED_TRANSITIONS, STATUS_LABEL, Task, TaskStatus } from '../core/models';
import { AvatarComponent } from '../shared/avatar';
import { PriorityBadgeComponent } from '../shared/badges';
import { IconComponent } from '../shared/icon';

@Component({
  selector: 'app-task-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, PriorityBadgeComponent, AvatarComponent, IconComponent],
  template: `
    <article class="task" (click)="open.emit()">
      <div class="row">
        <app-priority-badge [value]="task().priority" />
        <span class="id mono">{{ shortId() }}</span>
        <button class="menu-btn" (click)="toggleMenu($event)" aria-label="Ações">
          <app-icon name="dots" [size]="15" [stroke]="2" />
        </button>
      </div>

      <p class="title">{{ task().title }}</p>

      <div class="meta">
        <span class="who">
          <app-avatar [name]="task().assigneeName" [size]="20" />
          {{ task().assigneeName }}
        </span>
        @if (task().deadline) {
          <span class="chip" [class.late]="task().overdue">
            <app-icon [name]="task().overdue ? 'clock' : 'calendar'" [size]="12" [stroke]="1.7" />
            {{ task().overdue ? 'Atrasada · ' : '' }}{{ task().deadline | date: 'dd MMM' }}
          </span>
        }
      </div>

      @if (task().priority === 'CRITICAL' && task().status === 'IN_PROGRESS') {
        <span class="chip lock">
          <app-icon name="lock" [size]="12" [stroke]="1.8" /> Concluir: só Admin
        </span>
      }

      @if (menuOpen()) {
        <div class="menu" role="menu" (click)="$event.stopPropagation()">
          <div class="mh">Mover para</div>
          @for (s of nextStates(); track s) {
            <button class="mi" (click)="pick(s)">
              <app-icon [name]="s === 'IN_PROGRESS' && task().status === 'DONE' ? 'reopen' : 'chevron-right'" [size]="14" [stroke]="1.8" />
              {{ label(s) }}
              @if (s === 'IN_PROGRESS' && task().status === 'DONE') { <span class="tag">reabrir</span> }
            </button>
          }
          <button class="mi danger" (click)="del()">
            <app-icon name="trash" [size]="14" [stroke]="1.8" /> Excluir
          </button>
          @if (task().status === 'DONE') {
            <p class="mnote">Concluídas não voltam para “A fazer” — só reabrem em Em progresso.</p>
          }
        </div>
      }
    </article>
  `,
  styleUrl: './task-card.scss',
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  readonly menuOpen = input(false);
  readonly open = output<void>();
  readonly move = output<TaskStatus>();
  readonly delete = output<void>();
  readonly menuToggled = output<boolean>();

  protected readonly shortId = computed(() => 'T-' + this.task().id.slice(0, 4).toUpperCase());
  protected readonly nextStates = computed<TaskStatus[]>(() => ALLOWED_TRANSITIONS[this.task().status]);

  protected label(s: TaskStatus): string {
    return STATUS_LABEL[s];
  }

  protected toggleMenu(ev: Event): void {
    ev.stopPropagation();
    this.menuToggled.emit(!this.menuOpen());
  }

  protected pick(s: TaskStatus): void {
    this.menuToggled.emit(false);
    this.move.emit(s);
  }

  protected del(): void {
    this.menuToggled.emit(false);
    this.delete.emit();
  }
}
