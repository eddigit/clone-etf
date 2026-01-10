import asyncio
import json
from helloasso_service import helloasso_service

async def test():
    print("=== Test check_connection ===")
    status = await helloasso_service.check_connection()
    print(json.dumps(status, indent=2, default=str))
    
    print("\n=== Test get_all_members ===")
    members = await helloasso_service.get_all_members()
    print(f"Total membres trouvés: {len(members)}")

asyncio.run(test())
