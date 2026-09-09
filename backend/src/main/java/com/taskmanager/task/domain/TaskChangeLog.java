package com.taskmanager.task.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Escreve e lê o histórico de alterações da tarefa (audit log). Chamado por
 * {@link TaskService} dentro da mesma transação da alteração, então uma edição
 * que falha na validação não deixa rastro.
 */
@Service
public class TaskChangeLog {

    private final TaskChangeRepository mudancas;

    public TaskChangeLog(TaskChangeRepository mudancas) {
        this.mudancas = mudancas;
    }

    /**
     * Compara a tarefa (ainda com os valores antigos) com os valores que estão
     * prestes a ser aplicados e registra uma linha por campo que mudou. Todas as
     * linhas de uma edição compartilham o mesmo instante.
     */
    @Transactional
    public void registrarEdicao(Task antes, String titulo, String descricao, TaskPriority prioridade,
            UUID responsavel, Instant prazo, UUID autorId) {
        Instant agora = Instant.now();
        List<TaskChange> lista = new ArrayList<>();
        adicionarSeMudou(lista, antes.getId(), autorId, agora,
                TaskChangeType.ALTERACAO_TITULO, antes.getTitle(), titulo);
        adicionarSeMudou(lista, antes.getId(), autorId, agora,
                TaskChangeType.ALTERACAO_DESCRICAO, antes.getDescription(), descricao);
        adicionarSeMudou(lista, antes.getId(), autorId, agora,
                TaskChangeType.ALTERACAO_PRIORIDADE, antes.getPriority().name(), prioridade.name());
        adicionarSeMudou(lista, antes.getId(), autorId, agora,
                TaskChangeType.ALTERACAO_PRAZO, textoDe(antes.getDeadline()), textoDe(prazo));
        adicionarSeMudou(lista, antes.getId(), autorId, agora,
                TaskChangeType.ALTERACAO_RESPONSAVEL, antes.getAssigneeId().toString(), responsavel.toString());
        if (!lista.isEmpty()) {
            mudancas.saveAll(lista);
        }
    }

    @Transactional
    public void registrarMudancaDeStatus(UUID tarefaId, UUID autorId, TaskStatus de, TaskStatus para) {
        mudancas.save(TaskChange.de(tarefaId, autorId, TaskChangeType.ALTERACAO_STATUS,
                de.name(), para.name(), Instant.now()));
    }

    @Transactional
    public void registrarMudancaDeResponsavel(UUID tarefaId, UUID autorId, UUID de, UUID para) {
        if (Objects.equals(de, para)) {
            return;
        }
        mudancas.save(TaskChange.de(tarefaId, autorId, TaskChangeType.ALTERACAO_RESPONSAVEL,
                de.toString(), para.toString(), Instant.now()));
    }

    /** As alterações em ordem cronológica inversa (mais recente primeiro). */
    @Transactional(readOnly = true)
    public List<TaskChange> historico(UUID tarefaId) {
        return mudancas.findByTaskIdOrderByOccurredAtDescIdDesc(tarefaId);
    }

    private static void adicionarSeMudou(List<TaskChange> lista, UUID tarefaId, UUID autorId,
            Instant quando, TaskChangeType tipo, String antigo, String novo) {
        if (!Objects.equals(antigo, novo)) {
            lista.add(TaskChange.de(tarefaId, autorId, tipo, antigo, novo, quando));
        }
    }

    private static String textoDe(Instant instante) {
        return instante == null ? null : instante.toString();
    }
}
