import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task, TaskStatus } from '@shared/models';
import { TaskCardComponent } from './task-card.component';

function criarTarefa(sobrescrever: Partial<Task> = {}): Task {
  return {
    id: 'abcd1234-0000-0000-0000-000000000000',
    projectId: 'p1',
    title: 'Ligar a tela de login',
    description: null,
    status: 'TODO',
    priority: 'HIGH',
    assigneeId: 'u1',
    assigneeName: 'Alice',
    deadline: null,
    overdue: false,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    ...sobrescrever,
  };
}

describe('TaskCardComponent', () => {
  let fixture: ComponentFixture<TaskCardComponent>;
  let elemento: HTMLElement;

  async function montar(tarefa: Task, menuAberto = false): Promise<void> {
    fixture = TestBed.createComponent(TaskCardComponent);
    fixture.componentRef.setInput('tarefa', tarefa);
    fixture.componentRef.setInput('menuAberto', menuAberto);
    fixture.detectChanges();
    await fixture.whenStable();
    elemento = fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => TestBed.configureTestingModule({ imports: [TaskCardComponent] }));

  it('renderiza título, id curto e responsável', async () => {
    await montar(criarTarefa());
    expect(elemento.querySelector('.task-card__title')?.textContent).toContain(
      'Ligar a tela de login',
    );
    expect(elemento.querySelector('.task-card__id')?.textContent).toContain('T-ABCD');
    expect(elemento.querySelector('.task-card__assignee')?.textContent).toContain('Alice');
  });

  it('não mostra o menu enquanto `menuAberto` é false', async () => {
    await montar(criarTarefa(), false);
    expect(elemento.querySelector('.card-menu')).toBeNull();
  });

  it('o menu de uma tarefa TODO só oferece "Em progresso"', async () => {
    await montar(criarTarefa({ status: 'TODO' }), true);
    const itens = itensDoMenu();
    expect(itens).toEqual(['Em progresso']);
  });

  it('o menu de uma tarefa DONE oferece reabrir para "Em progresso" (RN-02)', async () => {
    await montar(criarTarefa({ status: 'DONE' }), true);
    expect(itensDoMenu()).toEqual(['Em progresso reabrir']);
  });

  it('escolher um destino emite `mover` e fecha o menu', async () => {
    await montar(criarTarefa({ status: 'IN_PROGRESS' }), true);
    const movidos: TaskStatus[] = [];
    const menu: boolean[] = [];
    fixture.componentInstance.mover.subscribe((s) => movidos.push(s));
    fixture.componentInstance.menuAlternado.subscribe((v) => menu.push(v));

    // IN_PROGRESS -> [TODO, DONE]; clica no primeiro item ("A fazer")
    botoesDoMenu()[0].click();

    expect(movidos).toEqual(['TODO']);
    expect(menu).toContain(false);
  });

  it('clicar no card emite `abrir`', async () => {
    await montar(criarTarefa());
    const abriu = jest.fn();
    fixture.componentInstance.abrir.subscribe(abriu);
    (elemento.querySelector('.task-card') as HTMLElement).click();
    expect(abriu).toHaveBeenCalledTimes(1);
  });

  it('clicar em "Excluir" emite `excluir`', async () => {
    await montar(criarTarefa(), true);
    const excluiu = jest.fn();
    fixture.componentInstance.excluir.subscribe(excluiu);
    (elemento.querySelector('.card-menu__item--danger') as HTMLElement).click();
    expect(excluiu).toHaveBeenCalledTimes(1);
  });

  function botoesDoMenu(): HTMLButtonElement[] {
    return Array.from(
      elemento.querySelectorAll<HTMLButtonElement>(
        '.card-menu__item:not(.card-menu__item--danger)',
      ),
    );
  }

  function itensDoMenu(): string[] {
    return botoesDoMenu().map((b) => (b.textContent ?? '').replace(/\s+/g, ' ').trim());
  }
});
