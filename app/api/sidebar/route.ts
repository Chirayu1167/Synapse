import { NextRequest, NextResponse } from "next/server";
import { getDashboardSidebarData } from "@/lib/data/dashboard-sidebar";
import { getAuthUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { profile, projects, requests } = await getDashboardSidebarData(user.id);

    return NextResponse.json({
      profile,
      projects,
      requests,
    });
  } catch (error) {
    console.error("Error in sidebar API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}