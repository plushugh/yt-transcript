FROM denoland/deno:1.41.0

WORKDIR /app

# Cache the dependencies
COPY deno.jsonc* .
COPY import_map.json* .
RUN deno cache --import-map=import_map.json main.ts

# Copy application files
COPY . .

# Compile the application
RUN deno cache main.ts

# The port your application listens on
EXPOSE 8000

CMD ["run", "--allow-net", "--allow-read", "--allow-env", "main.ts"] 