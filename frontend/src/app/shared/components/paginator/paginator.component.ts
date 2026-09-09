import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.scss',
})
export class PaginatorComponent {
  readonly pagina = input(0);
  readonly tamanho = input(20);
  readonly total = input(0);
  readonly totalDePaginas = input(1);
  readonly irPara = output<number>();

  protected readonly de = computed(() =>
    this.total() === 0 ? 0 : this.pagina() * this.tamanho() + 1,
  );
  protected readonly ate = computed(() =>
    Math.min(this.total(), (this.pagina() + 1) * this.tamanho()),
  );
}
