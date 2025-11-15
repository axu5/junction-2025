/**
 * Logged-out -> See public saunas, read public experiences.
 * Logged-in ->
 *   Friends’ recent sauna experiences
 *   Saved saunas
 */
export default function Home() {
  return (
    <div className='flex min-h-screen'>
      <h1 className='font-semibold'>Discover Saunas Around You</h1>
    </div>
  );
}
