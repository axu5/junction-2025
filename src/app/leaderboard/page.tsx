import { SoEmpty } from "@/components/so-empty";
import { Plus } from "lucide-react";

export default function Leaderboard() {
  return (
    <div className='flex flex-col gap-y-5'>
      <div className='flex w-full flex-row items-center justify-center'>
        <h1 className='font-semibold text-2xl'>My Experiences</h1>
      </div>

      <div className='flex flex-col items-center gap-y-3'>
        <SoEmpty
          info="You haven't added any friends on Saunapoints yet"
          ctaHref='/profile/friends/add'
          cta={
            <>
              <Plus className='w-4 h-4' />
              Add your first friend
            </>
          }
        />
      </div>
    </div>
  );
}
