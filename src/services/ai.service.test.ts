import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { aiService } from './ai.service';

const server = setupServer(
  http.post('/api/ai/chat', () => {
    return HttpResponse.json({ text: 'Hello from MSW' });
  }),
  http.post('/api/ai/tune', () => {
    return HttpResponse.json({ 'Learning Rate': -4.5 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AI Service Integration', () => {
  it('fetches chat responses correctly', async () => {
    const res = await aiService.askNetvisAI('test', 'MLP', 'pytorch', 1, []);
    expect(res).toBe('Hello from MSW');
  });

  it('handles network failure gracefully', async () => {
    server.use(
      http.post('/api/ai/chat', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    await expect(aiService.askNetvisAI('test', 'MLP', 'pytorch', 1, [])).rejects.toThrow();
  });

  it('fetches hyperparameter tuning suggestions', async () => {
    const res = await aiService.autoTuneHyperparameters('mlp', {});
    expect(res).toHaveProperty('Learning Rate', -4.5);
  });
});
