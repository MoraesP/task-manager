import { ALLOWED_TRANSITIONS, canTransition, TaskStatus } from './enums';

/**
 * Máquina de estados da tarefa no cliente (RN-01..04). O quadro barra a transição
 * antes de chamar a API e o menu de cada card só oferece as transições válidas.
 */
describe('canTransition', () => {
  it('permite as transições válidas (RN-01)', () => {
    expect(canTransition('TODO', 'IN_PROGRESS')).toBe(true);
    expect(canTransition('IN_PROGRESS', 'DONE')).toBe(true);
    expect(canTransition('IN_PROGRESS', 'TODO')).toBe(true);
    expect(canTransition('DONE', 'IN_PROGRESS')).toBe(true);
  });

  it('bloqueia TODO → DONE (RN-03): precisa passar por IN_PROGRESS', () => {
    expect(canTransition('TODO', 'DONE')).toBe(false);
  });

  it('bloqueia DONE → TODO (RN-02): concluída só reabre em IN_PROGRESS', () => {
    expect(canTransition('DONE', 'TODO')).toBe(false);
  });

  it('trata a transição para o mesmo estado como no-op válido (RN-04)', () => {
    for (const status of ['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]) {
      expect(canTransition(status, status)).toBe(true);
    }
  });

  it('ALLOWED_TRANSITIONS não expõe nenhuma transição proibida', () => {
    expect(ALLOWED_TRANSITIONS['TODO']).not.toContain('DONE');
    expect(ALLOWED_TRANSITIONS['DONE']).not.toContain('TODO');
  });
});
