import { ExperienceRenderer } from "@/components/experience-renderer";
import { SoEmpty } from "@/components/so-empty";
import { getSession } from "@/lib/auth";
import { getExperiencesForUser } from "@/lib/get-experiences-for-user";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SaunaExperiences() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const experiences = await getExperiencesForUser(session.user.id);

  // TODO: sort?
  return (
    <div className='flex flex-col gap-y-5'>
      <div className='flex w-full flex-row items-center justify-center'>
        <h1 className='font-semibold tracking-wide text-2xl'>
          My Experiences
        </h1>
      </div>

      {experiences.length === 0 ? (
        <div className='flex flex-col items-center gap-y-3'>
          <SoEmpty
            cta={
              <>
                <Plus /> Add your first sauna experience
              </>
            }
            ctaHref='/new-sauna-experience'
            info='You have no logged sauna experiences'
          />
        </div>
      ) : (
        experiences.map(exp => (
          <ExperienceRenderer
            key={`experience-${exp.id}`}
            experience={exp}
          />
        ))
      )}
    </div>
  );
}
