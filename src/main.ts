import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { createServer } from "http";
import { AppModule } from "./app.module";

async function findAvailablePort(
	preferredPort: number,
	maxRetries: number = 10
): Promise<number> {
	for (let i = 0; i < maxRetries; i++) {
		const port = preferredPort + i;
		try {
			const server = createServer();
			await new Promise<void>((resolve, reject) => {
				server.listen(port, "0.0.0.0", () => {
					server.close();
					resolve();
				});
				server.on("error", reject);
			});
			return port;
		} catch (err) {
			if (i === maxRetries - 1) {
				throw new Error(
					`Could not find available port starting from ${preferredPort}`
				);
			}
		}
	}
	return preferredPort;
}

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS
	app.enableCors({
		origin: process.env.CORS_ORIGIN || "http://localhost:3001",
		credentials: true,
	});

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		})
	);

	// API prefix
	app.setGlobalPrefix("api");

	// Swagger documentation
	const config = new DocumentBuilder()
		.setTitle("App Learn API")
		.setDescription("App Learn Documentation API")
		.setVersion("1.0")
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api/docs", app, document);

	const preferredPort = parseInt(process.env.PORT || "3000", 10);
	const port = await findAvailablePort(preferredPort);

	await app.listen(port);
	console.log(`Application is running on: http://localhost:${port}`);
	console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
