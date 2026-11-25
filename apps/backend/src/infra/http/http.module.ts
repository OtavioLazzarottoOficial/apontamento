import { DeleteReportController } from './controllers/delete-report.controller.ts';
import { DeleteReportUseCase } from '../../domain/sequencing/application/usecases/delete-report-usecase.ts';
import { AssociateReportMachineController } from './controllers/associate-report-machine.controller.ts';
import { MachinesController } from './controllers/machines.controller.ts';
import { ManageMachinesUseCase } from '../../domain/production/application/usecases/manage-machines-usecase.ts';
import { CapacityConfigurationController } from './controllers/capacity-configuration.controller.ts';
import { UpdateLineCompletionUseCase } from '../../domain/sequencing/application/usecases/update-line-completion-usecase.ts';
import { UpdateLineCompletionController } from './controllers/update-line-completion.controller.ts';
import { UpdateReportTextUseCase } from '../../domain/sequencing/application/usecases/update-report-text-usecase.ts';
import { UpdateReportTextController } from './controllers/update-report-text.controller.ts';
import { ListUsersUseCase } from '../../domain/auth/application/usecases/list-users-usecase.ts';
import { UpdatePermissionsUseCase } from '../../domain/auth/application/usecases/update-permissions-usecase.ts';
import { ManageUsersController } from './controllers/manage-users.controller.ts';
import { PreviewReportController } from './controllers/preview-report.controller.ts';
import { ExportPermissionGuard } from '../auth/export-permission.guard.ts';
import { PdfGenerator } from '../pdf/pdf-generator.ts';
import { ExportReportController } from './controllers/export-report.controller.ts';
import { UpdateReportLineUseCase } from '../../domain/sequencing/application/usecases/update-report-line-usecase.ts';
import { UpdateReportUseCase } from '../../domain/sequencing/application/usecases/update-report-usecase.ts';
import { UpdateReportLineController } from './controllers/update-report-line.controller.ts';
import { ListReportsUseCase } from '../../domain/sequencing/application/usecases/list-reports-usecase.ts';
import { ListReportsController } from './controllers/list-reports.controller.ts';
import { GetProfileController } from './controllers/get-profile.controller.ts';
import { RegisterUserUseCase } from '../../domain/auth/application/usecases/register-user-usecase.ts';
import { AdministratorGuard } from '../auth/administrator.guard.ts';
import { RegisterUserController } from './controllers/register-user.controller.ts';
import { GetReportUseCase } from '../../domain/sequencing/application/usecases/get-report-usecase.ts';
import { ExistingUserGuard } from '../auth/existing-user.guard.ts';
import { GetReportController } from './controllers/get-report.controller.ts';
import { CreateReportUseCase } from '../../domain/sequencing/application/usecases/create-report-usecase.ts';
import { PdfExtractor } from '../pdf/pdf-extractor.ts';
import { EditPermissionGuard } from '../auth/edit-permission.guard.ts';
import { ImportReportController } from './controllers/import-report.controller.ts';
import { CreateSessionController } from './controllers/create-session.controller.ts';
import { AuthenticateUserUseCase } from '../../domain/auth/application/usecases/authenticate-user-usecase.ts';
import { ConnectionController } from './connection.controller.ts';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.ts';
import { AppController } from './app.controller.ts';
import { HealthController } from './controllers/health.controller.ts';
import { CryptographyModule } from '../cryptography/cryptography.module.ts';
import { GetCapacityConfigurationUseCase } from '../../domain/production/application/usecases/get-capacity-configuration-usecase.ts';
import { UpdateCapacityConfigurationUseCase } from '../../domain/production/application/usecases/update-capacity-configuration-usecase.ts';
import { PdfReportPageSummaryUpdater } from '../pdf/pdf-report-page-summary-updater.ts';
import { ReportDocumentEditor } from '../../domain/sequencing/application/services/report-document-editor.ts';
import { PdfReportDocumentEditor } from '../pdf/pdf-report-document-editor.ts';
import { OriginalReportPdfController } from './controllers/original-report-pdf.controller.ts';

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    DeleteReportController,
    OriginalReportPdfController,
    AssociateReportMachineController,
    MachinesController,
    ConnectionController,
    CapacityConfigurationController,
    AppController,
    HealthController,
    CreateSessionController,
    ImportReportController,
    GetReportController,
    RegisterUserController,
    GetProfileController,
    ListReportsController,
    UpdateReportLineController,
    UpdateLineCompletionController,
    ExportReportController,
    PreviewReportController,
    ManageUsersController,
    UpdateReportTextController,
  ],
  providers: [
    DeleteReportUseCase,
    ManageMachinesUseCase,
    PdfReportPageSummaryUpdater,
    { provide: ReportDocumentEditor, useClass: PdfReportDocumentEditor },
    GetCapacityConfigurationUseCase,
    UpdateCapacityConfigurationUseCase,
    AuthenticateUserUseCase,
    CreateReportUseCase,
    PdfExtractor,
    EditPermissionGuard,
    ExistingUserGuard,
    GetReportUseCase,
    RegisterUserUseCase,
    AdministratorGuard,
    ListReportsUseCase,
    UpdateReportLineUseCase,
    UpdateLineCompletionUseCase,
    UpdateReportUseCase,
    PdfGenerator,
    ExportPermissionGuard,
    ListUsersUseCase,
    UpdatePermissionsUseCase,
    UpdateReportTextUseCase,
  ],
})
export class HttpModule {}
