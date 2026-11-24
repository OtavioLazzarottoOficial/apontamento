import { AlterarTextoRelatorioUseCase } from '../../domain/sequenciamento/application/usecases/alterar-texto-relatorio-usecase.ts';
import { AlterarTextoRelatorioController } from './controllers/alterar-texto-relatorio.controller.ts';
import { ListarUsuariosUseCase } from '../../domain/auth/application/usecases/listar-usuarios-usecase.ts';
import { AlterarPermissoesUseCase } from '../../domain/auth/application/usecases/alterar-permissoes-usecase.ts';
import { GerenciarUsuariosController } from './controllers/gerenciar-usuarios.controller.ts';
import { VisualizarRelatorioController } from './controllers/visualizar-relatorio.controller.ts';
import { PermissaoExportarGuard } from '../auth/permissao-exportar.guard.ts';
import { GeradorPdf } from '../pdf/gerador-pdf.ts';
import { ExportarRelatorioController } from './controllers/exportar-relatorio.controller.ts';
import { AlterarLinhaRelatorioUseCase } from '../../domain/sequenciamento/application/usecases/alterar-linha-relatorio-usecase.ts';
import { AtualizarRelatorioUseCase } from '../../domain/sequenciamento/application/usecases/atualizar-relatorio-usecase.ts';
import { AlterarLinhaRelatorioController } from './controllers/alterar-linha-relatorio.controller.ts';
import { ListarRelatoriosUseCase } from '../../domain/sequenciamento/application/usecases/listar-relatorios-usecase.ts';
import { ListarRelatoriosController } from './controllers/listar-relatorios.controller.ts';
import { ObterPerfilController } from './controllers/obter-perfil.controller.ts';
import { CadastrarUsuarioUseCase } from '../../domain/auth/application/usecases/cadastrar-usuario-usecase.ts';
import { AdministradorGuard } from '../auth/administrador.guard.ts';
import { CadastrarUsuarioController } from './controllers/cadastrar-usuario.controller.ts';
import { ObterRelatorioUseCase } from '../../domain/sequenciamento/application/usecases/obter-relatorio-usecase.ts';
import { UsuarioExistenteGuard } from '../auth/usuario-existente.guard.ts';
import { ObterRelatorioController } from './controllers/obter-relatorio.controller.ts';
import { CriarRelatorioUseCase } from '../../domain/sequenciamento/application/usecases/criar-relatorio-usecase.ts';
import { ExtratorPdf } from '../pdf/extrator-pdf.ts';
import { PermissaoEditarGuard } from '../auth/permissao-editar.guard.ts';
import { ImportarRelatorioController } from './controllers/importar-relatorio.controller.ts';
import { CriarSessaoController } from './controllers/criar-sessao.controller.ts';
import { AutenticarUsuarioUseCase } from '../../domain/auth/application/usecases/autenticar-usuario-usecase.ts';
import { ConnectionController } from './connection.controller.ts';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.ts';
import { AppController } from './app.controller.ts';
import { HealthController } from './controllers/health.controller.ts';
import { CryptographyModule } from '../cryptography/cryptography.module.ts';

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    ConnectionController,
    AppController,
    HealthController,
    CriarSessaoController,
    ImportarRelatorioController,
    ObterRelatorioController,
    CadastrarUsuarioController,
    ObterPerfilController,
    ListarRelatoriosController,
    AlterarLinhaRelatorioController,
    ExportarRelatorioController,
    VisualizarRelatorioController,
    GerenciarUsuariosController,
    AlterarTextoRelatorioController,
  ],
  providers: [
    AutenticarUsuarioUseCase,
    CriarRelatorioUseCase,
    ExtratorPdf,
    PermissaoEditarGuard,
    UsuarioExistenteGuard,
    ObterRelatorioUseCase,
    CadastrarUsuarioUseCase,
    AdministradorGuard,
    ListarRelatoriosUseCase,
    AlterarLinhaRelatorioUseCase,
    AtualizarRelatorioUseCase,
    GeradorPdf,
    PermissaoExportarGuard,
    ListarUsuariosUseCase,
    AlterarPermissoesUseCase,
    AlterarTextoRelatorioUseCase,
  ],
})
export class HttpModule {}
