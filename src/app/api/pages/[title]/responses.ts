import { Block } from "@/app/lib/markdown";

interface IResponse {
  statusDescription: string;
  statusCode: number;

  toJSON(): object;
  toResponse(): Response;
}

class Response200 implements IResponse {
  statusDescription = "ok";
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
        status: this.statusDescription,
      },
    };
  }
}

export class ResponseSuccess extends Response200 {
  statusDescription = "succeed";
}

export class ResponseUpdated extends Response200 {
  statusDescription = "updated";
}

export class ResponseUnchanged implements IResponse {
  statusDescription = "unchanged";
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
        status: this.statusDescription,
        message: this.message,
      },
    };
  }
}

export class ResponseError implements IResponse {
  statusDescription = "unchanged";
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
        status: this.statusDescription,
        message: this.message,
      },
    };
  }
}
