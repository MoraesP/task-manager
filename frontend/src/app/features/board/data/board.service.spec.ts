import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MembersService } from '@features/members/data/members.service';
import { PageResponse, Task } from '@shared/models';
import { BoardService } from './board.service';
import { TasksApiService } from './tasks-api.service';

let sequencia = 0;

function tarefa(sobrescrever: Partial<Task> = {}): Task {
  return {
    id: `task-${++sequencia}`,
    projectId: 'p1',
    title: 't',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: 'u1',
    assigneeName: 'Alice',
    deadline: null,
    overdue: false,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    ...sobrescrever,
  };
}

function pagina(conteudo: Task[]): PageResponse<Task> {
  return { content: conteudo, page: 0, size: 100, totalElements: conteudo.length, totalPages: 1 };
}

describe('BoardService', () => {
  let servico: BoardService;
  let api: jest.Mocked<Pick<TasksApiService, 'listar' | 'criar' | 'atualizar' | 'excluir'>>;

  const a = tarefa({ status: 'TODO', title: 'A' });
  const b = tarefa({ status: 'IN_PROGRESS', title: 'B' });
  const c = tarefa({ status: 'DONE', title: 'C' });

  beforeEach(() => {
    api = {
      listar: jest.fn().mockReturnValue(of(pagina([a, b, c]))),
      criar: jest.fn(),
      atualizar: jest.fn(),
      excluir: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        BoardService,
        { provide: TasksApiService, useValue: api },
        { provide: MembersService, useValue: { listar: jest.fn().mockReturnValue(of([])) } },
      ],
    });
    servico = TestBed.inject(BoardService);
    servico.iniciar('p1');
  });

  it('agrupa as tarefas carregadas por coluna', () => {
    expect(api.listar).toHaveBeenCalledWith('p1', expect.anything(), 0, expect.any(Number));
    expect(servico.colunas()['TODO']).toEqual([a]);
    expect(servico.colunas()['IN_PROGRESS']).toEqual([b]);
    expect(servico.colunas()['DONE']).toEqual([c]);
    expect(servico.total()).toBe(3);
    expect(servico.carregando()).toBe(false);
  });

  it('moverOtimista muda o card de coluna sem chamar a API', () => {
    servico.moverOtimista(a.id, 'DONE');
    expect(servico.colunas()['TODO']).toEqual([]);
    expect(
      servico
        .colunas()
        ['DONE'].map((t) => t.id)
        .sort(),
    ).toEqual([a.id, c.id].sort());
    expect(servico.colunas()['DONE'].every((t) => t.status === 'DONE')).toBe(true);
    expect(api.listar).toHaveBeenCalledTimes(1); // só a carga inicial

    // e volta ao chamar de novo com a origem (revert do componente em erro)
    servico.moverOtimista(a.id, 'TODO');
    expect(servico.colunas()['TODO'].map((t) => t.id)).toEqual([a.id]);
  });

  it('criar coloca a nova tarefa no topo da coluna correspondente', (done) => {
    const nova = tarefa({ status: 'TODO', title: 'Nova' });
    api.criar.mockReturnValue(of(nova));

    servico
      .criar({
        title: 'Nova',
        description: null,
        priority: 'LOW',
        deadline: null,
        assigneeId: 'u1',
      })
      .subscribe(() => {
        expect(servico.colunas()['TODO'].map((t) => t.title)).toEqual(['Nova', 'A']);
        done();
      });
  });

  it('atualizar substitui a tarefa na lista pelo retorno do servidor', (done) => {
    const editada = { ...b, title: 'B editada' };
    api.atualizar.mockReturnValue(of(editada));

    servico
      .atualizar(b.id, {
        title: 'B editada',
        description: null,
        priority: 'MEDIUM',
        deadline: null,
        assigneeId: 'u1',
      })
      .subscribe(() => {
        expect(servico.colunas()['IN_PROGRESS'][0].title).toBe('B editada');
        done();
      });
  });

  it('excluir remove a tarefa da lista', (done) => {
    api.excluir.mockReturnValue(of(undefined));
    servico.excluir(c.id).subscribe(() => {
      expect(servico.colunas()['DONE']).toEqual([]);
      expect(servico.tarefas().some((t) => t.id === c.id)).toBe(false);
      done();
    });
  });
});
