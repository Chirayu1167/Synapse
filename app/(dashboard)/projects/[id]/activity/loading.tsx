import Spinner from "@/components/ui/Spinner";

export default function ActivityLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}