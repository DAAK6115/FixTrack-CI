from urllib.parse import parse_qs

from channels.db import (
    database_sync_to_async,
)

from django.contrib.auth.models import (
    AnonymousUser,
)

from rest_framework_simplejwt.tokens import (
    AccessToken,
)

from apps.accounts.models import User


@database_sync_to_async
def get_user(
    user_id,
):
    try:
        return (
            User.objects
            .select_related(
                "organization"
            )
            .get(
                pk=user_id,
                is_active=True,
            )
        )

    except User.DoesNotExist:
        return AnonymousUser()


class JWTAuthMiddleware:
    def __init__(
        self,
        inner,
    ):
        self.inner = inner

    async def __call__(
        self,
        scope,
        receive,
        send,
    ):
        scope = dict(scope)

        scope["user"] = (
            AnonymousUser()
        )

        try:
            query_string = (
                scope.get(
                    "query_string",
                    b"",
                )
                .decode()
            )

            params = parse_qs(
                query_string
            )

            token = (
                params
                .get(
                    "token",
                    [None],
                )[0]
            )

            if token:
                access_token = (
                    AccessToken(
                        token
                    )
                )

                user_id = (
                    access_token[
                        "user_id"
                    ]
                )

                scope["user"] = (
                    await get_user(
                        user_id
                    )
                )

        except Exception:
            scope["user"] = (
                AnonymousUser()
            )

        return await self.inner(
            scope,
            receive,
            send,
        )
