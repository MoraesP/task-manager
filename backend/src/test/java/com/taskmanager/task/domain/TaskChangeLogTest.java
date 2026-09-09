package com.taskmanager.task.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskChangeLogTest {

    @Mock
    TaskChangeRepository mudancas;
    @InjectMocks
    TaskChangeLog log;

    private final UUID autorId = UUID.randomUUID();
    private final UUID responsavel = UUID.randomUUID();

    private Task tarefa(String titulo, String descricao, TaskPriority prioridade, Instant prazo) {
        return new Task(UUID.randomUUID(), titulo, descricao, prioridade, responsavel, prazo, autorId);
    }

    @Test
    void registraUmaLinhaPorCampoAlteradoNaEdicao() {
        Task antes = tarefa("Título antigo", "desc", TaskPriority.LOW, null);

        log.registrarEdicao(antes, "Título novo", "desc", TaskPriority.HIGH, responsavel, null, autorId);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<TaskChange>> captor = ArgumentCaptor.forClass(List.class);
        verify(mudancas).saveAll(captor.capture());
        List<TaskChange> salvas = captor.getValue();

        assertThat(salvas).extracting(TaskChange::getType)
                .containsExactlyInAnyOrder(TaskChangeType.ALTERACAO_TITULO, TaskChangeType.ALTERACAO_PRIORIDADE);
        TaskChange titulo = salvas.stream()
                .filter(m -> m.getType() == TaskChangeType.ALTERACAO_TITULO).findFirst().orElseThrow();
        assertThat(titulo.getOldValue()).isEqualTo("Título antigo");
        assertThat(titulo.getNewValue()).isEqualTo("Título novo");
        assertThat(salvas).allSatisfy(m -> assertThat(m.getOccurredAt()).isNotNull());
    }

    @Test
    void naoRegistraNadaQuandoAEdicaoNaoMudaCampo() {
        Task antes = tarefa("Igual", "desc", TaskPriority.MEDIUM, null);

        log.registrarEdicao(antes, "Igual", "desc", TaskPriority.MEDIUM, responsavel, null, autorId);

        verify(mudancas, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void registraMudancaDeStatus() {
        UUID tarefaId = UUID.randomUUID();

        log.registrarMudancaDeStatus(tarefaId, autorId, TaskStatus.TODO, TaskStatus.IN_PROGRESS);

        ArgumentCaptor<TaskChange> captor = ArgumentCaptor.forClass(TaskChange.class);
        verify(mudancas).save(captor.capture());
        assertThat(captor.getValue().getType()).isEqualTo(TaskChangeType.ALTERACAO_STATUS);
        assertThat(captor.getValue().getOldValue()).isEqualTo("TODO");
        assertThat(captor.getValue().getNewValue()).isEqualTo("IN_PROGRESS");
    }

    @Test
    void naoRegistraReatribuicaoParaOMesmoResponsavel() {
        UUID mesmo = UUID.randomUUID();

        log.registrarMudancaDeResponsavel(UUID.randomUUID(), autorId, mesmo, mesmo);

        verify(mudancas, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
