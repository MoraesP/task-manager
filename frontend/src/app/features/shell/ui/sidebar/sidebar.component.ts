import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { LayoutService } from '@core/layout/layout.service';
import { ProjectsService } from '@features/projects/data/projects.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { RoleBadgeComponent } from '@shared/components/role-badge/role-badge.component';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, AvatarComponent, RoleBadgeComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly roteador = inject(Router);
  private readonly autenticacao = inject(AuthService);
  private readonly servicoDeProjetos = inject(ProjectsService);
  private readonly layout = inject(LayoutService);

  protected readonly projeto = this.servicoDeProjetos.projetoAtual;
  protected readonly nomeDoUsuario = computed(() => this.autenticacao.usuario()?.name ?? '');

  private readonly urlAtual = toSignal(
    this.roteador.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.roteador.url),
      startWith(this.roteador.url),
    ),
    { initialValue: this.roteador.url },
  );

  protected readonly secao = computed(() => {
    const caminho = this.urlAtual().split('?')[0];
    const correspondencia = caminho.match(/^\/projetos\/[^/]+\/([^/]+)/);
    if (correspondencia) {
      return correspondencia[1];
    }
    if (caminho === '/projetos' || caminho === '/') {
      return 'projetos';
    }
    return '';
  });

  protected fechar(): void {
    this.layout.fecharMenuLateral();
  }

  protected irParaProjetos(): void {
    this.fechar();
    this.roteador.navigateByUrl('/projetos');
  }

  protected sair(): void {
    this.autenticacao.sair();
    this.roteador.navigateByUrl('/entrar');
  }
}
