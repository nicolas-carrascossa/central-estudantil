  import { NextRequest, NextResponse } from "next/server";
  import { auth } from "@/lib/auth";

  export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const { name, email, password } = body;

      // Validações básicas
      if (!name?.trim()) {
        return NextResponse.json(
          { success: false, error: "Nome é obrigatório" },
          { status: 400 }
        );
      }
      if (!email?.trim()) {
        return NextResponse.json(
          { success: false, error: "Email é obrigatório" },
          { status: 400 }
        );
      }
      if (!password || password.length < 8) {
        return NextResponse.json(
          { success: false, error: "A senha deve ter pelo menos 8 caracteres" },
          { status: 400 }
        );
      }

      // Cria o primeiro admin
      const response = await auth.api.createUser({
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: "admin",
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Admin criado com sucesso!",
          data: response
        },
        { status: 201 }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar admin";
      console.error("Erro ao criar admin:", message);

      if (message.includes("already") || message.includes("existe")) {
        return NextResponse.json(
          { success: false, error: "Este email já está em uso" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }
  }
