import os

from django.core.asgi import (
    get_asgi_application,
)


os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)


django_asgi_application = (
    get_asgi_application()
)


from channels.routing import (  # noqa: E402
    ProtocolTypeRouter,
    URLRouter,
)
from channels.security.websocket import (  # noqa: E402
    AllowedHostsOriginValidator,
)

from apps.notifications.middleware import (  # noqa: E402
    JWTAuthMiddleware,
)
from apps.notifications.routing import (  # noqa: E402
    websocket_urlpatterns,
)


application = ProtocolTypeRouter(
    {
        "http": (
            django_asgi_application
        ),

        "websocket": (
            AllowedHostsOriginValidator(
                JWTAuthMiddleware(
                    URLRouter(
                        websocket_urlpatterns
                    )
                )
            )
        ),
    }
)
