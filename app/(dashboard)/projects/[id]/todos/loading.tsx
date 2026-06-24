import Spinner from "@/components/ui/Spinner";

export default function TodosLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}