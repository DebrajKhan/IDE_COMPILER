FROM alpine:latest
# Install GCC, G++, GDB, and build tools
RUN apk add --no-cache gcc g++ musl-dev gdb

# Create our secure user
RUN adduser -D sandboxuser

WORKDIR /app

# Give the sandboxuser ownership of the /app directory!
RUN chown -R sandboxuser:sandboxuser /app

USER sandboxuser