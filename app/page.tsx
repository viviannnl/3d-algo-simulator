import { redirect } from "next/navigation";
import { firstLesson } from "@/lib/course";

/** No landing page: the app opens straight into the first lesson of the course. */
export default function Home() {
  redirect(`/algorithms/${firstLesson.slug}`);
}
