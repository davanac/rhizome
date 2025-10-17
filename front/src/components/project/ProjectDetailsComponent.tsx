import { Project } from "@/types/project";
import { ClientBlock } from "../blocks/ClientBlock";
import { ProjectDetailsBlock } from "../blocks/ProjectDetailsBlock";
import { CertificationBlock } from "../blocks/CertificationBlock";
import { TestimonialBlock } from "../TestimonialBlock";
import { decodeHtmlEntities } from "@/utils/textUtils";


interface ProjectDetailsProps {
  project: Project;
}

export const ProjectDetailsComponent = ({ project }) => {



  console.log('=== project === ProjectDetailsComponent.tsx === key: 278684 ===');
  console.dir(project, { depth: null, colors: true })
  console.log('=================================');
  
  return (
    <div className="space-y-12 mt-12">
      <div className="prose max-w-none">
        <p className="text-gray-600 text-lg leading-relaxed">
          {decodeHtmlEntities(project.description)}
        </p>
      </div>

      {
        <ProjectDetailsBlock 
        dueDate={project.dueDate}
        links={project.links}
        author={project.author}
        participants={project.participants}
        observers={project.observers}
        thumbnail={project.thumbnail || project.banner_url}
        title={project.title}
        statusId={project.statusId}
        projectId={project.id}
        stringified={project.stringified}
        hash={project.hash}
        nftImg={project.nftImg}
      />
      }

      {project.testimonial ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TestimonialBlock testimonial={project.testimonial} />
          </div>
          <div className="lg:col-span-1">
            <ClientBlock 
              client={project.client}
              testimonial={project.testimonial}
            />
          </div>
        </div>
      ) : (
        <ClientBlock 
          client={project.client}
          testimonial={project.testimonial}
        />
      )}

      {
        project.statusId ===4 && <CertificationBlock projectId={project.id} project={project}/>
      }
    </div>
  );
};