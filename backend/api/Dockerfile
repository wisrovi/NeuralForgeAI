FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

RUN python3 -c "import main; print('Import test successful')"

EXPOSE 8000

CMD ["python3", "main.py"]