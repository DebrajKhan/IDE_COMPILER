FROM python:3.11-slim
WORKDIR /app
RUN adduser --disabled-password --gecos "" sandboxuser
RUN chown -R sandboxuser:sandboxuser /app
USER sandboxuser