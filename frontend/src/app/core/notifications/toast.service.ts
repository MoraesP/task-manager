import { Injectable, signal } from '@angular/core';

export type TipoDeToast = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  tipo: TipoDeToast;
  texto: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private sequencia = 0;
  private readonly _mensagens = signal<Toast[]>([]);
  readonly mensagens = this._mensagens.asReadonly();

  exibir(texto: string, tipo: TipoDeToast = 'info', duracaoMs = 4500): void {
    const id = ++this.sequencia;
    this._mensagens.update((lista) => [...lista, { id, tipo, texto }]);
    setTimeout(() => this.descartar(id), duracaoMs);
  }

  sucesso(texto: string): void {
    this.exibir(texto, 'success');
  }

  erro(texto: string): void {
    this.exibir(texto, 'error', 6000);
  }

  descartar(id: number): void {
    this._mensagens.update((lista) => lista.filter((mensagem) => mensagem.id !== id));
  }
}
