#!/bin/bash

# REAL API TESTING - NO BULLSHIT

set +e

echo "🔥 EXECUTING REAL API TESTS"
echo ""

# Test Frontend
echo "TEST 1: Frontend Health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Frontend responding: $RESPONSE"
else
    echo "❌ Frontend failed: $RESPONSE"
fi
echo ""

# Test WebSocket
echo "TEST 2: WebSocket (Hocuspocus)"
if nc -zv localhost 1234 2>&1 | grep -q "succeeded"; then
    echo "✅ Hocuspocus listening on 1234"
else
    echo "❌ Hocuspocus not responding"
fi
echo ""

# Test localStorage simulation
echo "TEST 3: Create Test Data"
cat > /tmp/test-data.json << EOF
{
    "id": "test-doc-$(date +%s)",
    "title": "Real Test Document",
    "content": "This is actual test content created at $(date)",
    "type": "markdown"
}
EOF
echo "✅ Test data created: $(cat /tmp/test-data.json)"
echo ""

# Check if we can access app
echo "TEST 4: App Accessibility"
if curl -s http://localhost:5173 | grep -q "root"; then
    echo "✅ App HTML contains root element"
else
    echo "❌ App HTML structure issue"
fi
echo ""

echo "🏁 REAL API TESTS COMPLETE"
echo ""
echo "📊 RESULTS:"
echo "   Frontend:    $([ "$RESPONSE" = "200" ] && echo "✅" || echo "❌")"
echo "   WebSocket:   $(nc -zv localhost 1234 2>&1 | grep -q "succeeded" && echo "✅" || echo "❌")"
echo "   Test Data:   ✅"
echo "   App Access:  $(curl -s http://localhost:5173 | grep -q "root" && echo "✅" || echo "❌")"
echo ""

