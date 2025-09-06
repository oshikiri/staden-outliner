import { Block } from "@/app/lib/markdown";

interface IResponse {
  status: string;
  statusCode: number;

  toJSON(): object;
  toResponse(): Response;
}

// RV: `status` carries a string like "200" here but subclasses use values like "succeed". Consider unifying the semantics or renaming the field to avoid confusion.
class Response200 implements IResponse {
  status = "200";
  statusCode = 200;

  constructor(private page: Block) {}
  toResponse() {
    return new Response(JSON.stringify(this.page), {
      status: this.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  toJSON() {
    return {
      updateResults: {
        status: this.status,
      },
    };
  }
}

export class ResponseSuccess extends Response200 {
  status = "succeed";
}

export class ResponseUpdated extends Response200 {
  status = "updated";
}

export class ResponseUnchanged implements IResponse {
  status = "unchanged";
  statusCode = 200;

  constructor(public message: string) {}
  toResponse(): Response {
    return new Response(JSON.stringify(this.toJSON()), {
      status: this.statusCode,
    });
  }
  toJSON() {
    return {
      updateResults: {
        status: this.status,
        message: this.message,
      },
    };
  }
}

export class ResponseError implements IResponse {
  status = "unchanged";
  statusCode = 400;

  constructor(public message: string) {}
  toResponse(): Response {
    return new Response(JSON.stringify(this.toJSON()), {
      status: this.statusCode,
    });
  }
  toJSON() {
    return {
      updateResults: {
        status: this.status,
        message: this.message,
      },
    };
  }
}
