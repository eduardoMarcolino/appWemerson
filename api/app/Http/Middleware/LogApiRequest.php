<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class LogApiRequest
{
    public function handle(Request $request, Closure $next)
    {
        $startedAt = microtime(true);
        $status = 500;

        try {
            $response = $next($request);
            $status = $response->getStatusCode();

            return $response;
        } catch (Throwable $exception) {
            $status = $this->statusForException($exception);

            throw $exception;
        } finally {
            try {
                $route = $request->route();

                Log::channel('api_requests')->info('Requisição à API', [
                    'datetime' => now()->toIso8601String(),
                    'method' => $request->method(),
                    // Usa o modelo da rota, sem parâmetros, query string, tokens ou dados da URL.
                    'url' => $route?->uri() ?? '[rota-nao-correspondida]',
                    'route' => $route?->uri(),
                    'route_name' => $route?->getName(),
                    'user_id' => $request->user()?->getAuthIdentifier(),
                    'ip' => $request->ip(),
                    'status' => $status,
                    'duration_ms' => round((microtime(true) - $startedAt) * 1000, 2),
                ]);
            } catch (Throwable $loggingException) {
                // Uma falha ao gravar o log não deve derrubar a requisição da API.
                report($loggingException);
            }
        }
    }

    private function statusForException(Throwable $exception): int
    {
        if ($exception instanceof HttpExceptionInterface) {
            return $exception->getStatusCode();
        }

        if ($exception instanceof ValidationException) {
            return $exception->status;
        }

        if ($exception instanceof AuthenticationException) {
            return 401;
        }

        if ($exception instanceof AuthorizationException) {
            return 403;
        }

        return 500;
    }
}
