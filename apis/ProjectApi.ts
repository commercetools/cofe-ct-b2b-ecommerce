import { ProjectSettings } from '@b2bdemo/types/types/ProjectSettings';
import { ProjectApi as BaseProjectApi} from 'cofe-ct-ecommerce/apis/ProjectApi';

export class ProjectApi extends BaseProjectApi {
  getProjectSettings: () => Promise<ProjectSettings> = async () => {
    const project = await this.getProject();

    return Promise.resolve({
      name: project.name,
      countries: project.countries,
      currencies: project.currencies,
      languages: project.languages,
    });
  };
}
