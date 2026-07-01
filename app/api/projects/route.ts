import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/users";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Failed to create project";
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await ensureUserProfile(supabase, user);

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const { data: rpcProjectId, error: rpcError } = await supabase.rpc(
      "create_project_for_current_user",
      {
        project_name: name,
        project_description: description,
      }
    );

    if (!rpcError && rpcProjectId) {
      revalidatePath("/projects");
      return NextResponse.json({ projectId: rpcProjectId });
    }

    const project = { id: crypto.randomUUID(), name };
    const { error: projectError } = await supabase
      .from("projects")
      .insert({
        id: project.id,
        name: project.name,
        description,
        owner_id: user.id,
      });

    if (projectError) throw projectError;

    const { error: memberError } = await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
      role: "owner",
      status: "active",
    });
    if (memberError) throw memberError;

    const { error: activityError } = await supabase.from("activity_log").insert({
      project_id: project.id,
      actor_id: user.id,
      action: "created this project",
      entity_type: "project",
      entity_id: project.id,
      entity_title: project.name,
    });
    if (activityError) {
      console.error("Failed to log project creation", activityError);
    }

    revalidatePath("/projects");
    return NextResponse.json({ projectId: project.id });
  } catch (error) {
    console.error("Failed to create project", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
