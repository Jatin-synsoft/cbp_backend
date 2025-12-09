import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
      <html>
        <head>
          <title>Consultant Booking Platform API</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #f0f2f5;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: #fff;
              padding: 2rem;
              border-radius: 10px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              max-width: 600px;
              width: 100%;
              text-align: center;
            }
            h1 {
              color: #2c3e50;
              margin-bottom: 0.5rem;
            }
            p {
              font-size: 1rem;
              margin: 0.3rem 0;
            }
            .btn {
              display: inline-block;
              padding: 0.7rem 1.5rem;
              background: #27ae60;
              color: #fff;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin-top: 1.5rem;
              transition: background 0.3s;
            }
            .btn:hover { background: #219150; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Consultant Booking Platform API</h1>
            <p><strong>Description:</strong> NestJS backend for a consultant booking and scheduling platform.</p>
            <p><strong>Version:</strong> 1.0</p>
            <a class="btn" href="/api">Go to Swagger Docs</a>
          </div>
        </body>
      </html>
    `;
  }
}
