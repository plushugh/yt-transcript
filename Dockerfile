FROM denoland/deno:2

WORKDIR /app

# Copy application files
COPY . .
RUN deno cache --import-map=import_map.json main.ts


# Compile the application
RUN deno cache main.ts

# The port your application listens on
EXPOSE 8000

CMD ["run", "--allow-net", "--allow-read", "--allow-env", "main.ts"] 