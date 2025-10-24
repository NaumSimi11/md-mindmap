# Edge Labels & Connection Icons - Feature Guide

## 🎨 **Enhanced Edge Label Editor**

The edge label editor now includes **60+ quick labels** organized into 4 categories, plus a grid of **20 connection icons** for visual communication.

---

## 📊 **Connection Icons (20 Icons)**

Visual symbols you can add to connection lines:

### **Directional Arrows**
- `→` Right arrow (leads to, flows to)
- `⇄` Bidirectional (two-way relationship)
- `⇒` Bold arrow (strong direction)
- `↳` Corner arrow (branches to)
- `⑂` Fork (splits into multiple paths)
- `⑃` Merge (combines from multiple sources)

### **Flow & Process**
- `🔄` Refresh/Cycle (repeating process)
- `🔁` Repeat (loop back)
- `⚡` Bolt (triggers, fast action)
- `🔗` Link (connected, related)
- `⛓️‍💥` Unlink (breaks connection)

### **Logic & Validation**
- `+` Plus (addition, combines)
- `−` Minus (subtraction, removes)
- `✕` X (excludes, blocks)
- `✓` Check (validates, confirms)
- `?` Question (uncertain, needs clarification)
- `!` Alert (important, urgent)

### **Time & Money**
- `⏱️` Stopwatch (duration, time-sensitive)
- `📅` Calendar (scheduled, dated)
- `💰` Money (cost, budget)

---

## 🏷️ **Quick Labels by Category**

### **1. Conditional / Decision (8 labels)**
Perfect for flowcharts, decision trees, and conditional logic:

- `✅ YES` - Positive condition met
- `❌ NO` - Negative condition met
- `✓ TRUE` - Boolean true
- `✗ FALSE` - Boolean false
- `↗️ IF` - Conditional branch (if statement)
- `↘️ ELSE` - Alternative branch (else statement)
- `1️⃣ Option 1` - First choice
- `2️⃣ Option 2` - Second choice

**Use Cases:**
- Decision flowcharts
- Conditional logic diagrams
- A/B testing flows
- Multi-option scenarios

---

### **2. Relationships (12 labels)**
Describe how nodes relate to each other:

- `➡️ Leads to` - Causality, progression
- `🔄 Depends on` - Prerequisite, dependency
- `⚡ Triggers` - Initiates, activates
- `🎯 Influences` - Affects, impacts
- `📤 Sends to` - Data/message flow out
- `📥 Receives from` - Data/message flow in
- `🔗 Related to` - General connection
- `✨ Requires` - Mandatory prerequisite
- `🚀 Results in` - Outcome, consequence
- `🤝 Supports` - Reinforces, backs
- `⚔️ Conflicts with` - Contradicts, opposes
- `🔀 Branches to` - Splits into paths

**Use Cases:**
- System architecture diagrams
- Process flows
- Dependency graphs
- Relationship mapping

---

### **3. Time / Cost / Priority (12 labels)**
Add project management context:

**Time:**
- `📅 2 weeks` - Duration estimate
- `⏱️ 3 days` - Short duration
- `⏰ 1 hour` - Very short duration

**Cost:**
- `💰 $5,000` - High cost
- `💵 $500` - Low cost

**Priority:**
- `📊 High` - High priority
- `📈 Medium` - Medium priority
- `📉 Low` - Low priority
- `🔥 Urgent` - Critical, immediate
- `❄️ Low Priority` - Can wait

**Ownership:**
- `👤 John` - Individual owner
- `👥 Team A` - Team ownership

**Use Cases:**
- Project planning
- Resource allocation
- Timeline visualization
- Budget tracking

---

## 🎯 **How to Use**

### **Method 1: Click an Edge**
1. Click any connection line (edge) in the diagram
2. The right sidebar opens showing "🔗 Connection Details"
3. Choose from:
   - **Text Input**: Type a custom label
   - **Connection Icons**: Click an icon (20 options)
   - **Quick Labels**: Click a pre-made label (32 options)
4. The label appears immediately on the connection line

### **Method 2: Custom Text**
1. Select an edge
2. Type in the "Connection Label" text field
3. Press Enter or click outside
4. Your custom text appears on the edge

### **Method 3: Remove Label**
1. Select an edge with a label
2. Click "Remove Label" button at the bottom
3. The label is cleared

---

## 💡 **Best Practices**

### **Keep Labels Concise**
- ✅ Good: "Depends on", "2 weeks", "YES"
- ❌ Bad: "This node depends on the completion of the previous node"

### **Use Icons for Visual Clarity**
- Icons are faster to scan than text
- Use `→` for simple flow
- Use `🔄` for cycles/loops
- Use `⚡` for triggers/events

### **Combine Icons + Text**
- `⚡ Triggers` - Icon + relationship
- `📅 2 weeks` - Icon + time
- `💰 $5,000` - Icon + cost

### **Color Coding (Future Enhancement)**
- Different edge colors for different relationship types
- Red for conflicts, green for success paths, blue for data flow

### **Consistency**
- Use the same labels for the same types of relationships
- Create a legend if using many different labels
- Standardize within your team

---

## 🔍 **Common Use Cases**

### **1. Software Architecture Diagram**
```
[Frontend] ──📤 API Calls──> [Backend]
[Backend] ──📥 Returns Data──> [Frontend]
[Backend] ──🔄 Depends on──> [Database]
[Cache] ──⚡ Triggers──> [Invalidation]
```

### **2. Decision Flowchart**
```
[Start] ──→──> [Check Auth]
[Check Auth] ──✅ YES──> [Dashboard]
[Check Auth] ──❌ NO──> [Login Page]
[Login Page] ──✓ Success──> [Dashboard]
```

### **3. Project Timeline**
```
[Planning] ──📅 2 weeks──> [Design]
[Design] ──⏱️ 3 days──> [Development]
[Development] ──💰 $5,000──> [Testing]
[Testing] ──🔥 Urgent──> [Launch]
```

### **4. Data Flow Diagram**
```
[User Input] ──📤 Sends to──> [Validator]
[Validator] ──✓ Valid──> [Database]
[Validator] ──✗ Invalid──> [Error Handler]
[Database] ──📥 Returns──> [UI]
```

### **5. Dependency Graph**
```
[Module A] ──✨ Requires──> [Module B]
[Module B] ──🔄 Depends on──> [Module C]
[Module D] ──⚔️ Conflicts with──> [Module E]
[Module F] ──🤝 Supports──> [Module G]
```

---

## 📈 **Statistics**

- **Total Quick Options**: 52 (20 icons + 32 labels)
- **Categories**: 4 (Icons, Conditional, Relationships, Time/Cost/Priority)
- **Most Popular Icons**: `→`, `🔄`, `⚡`, `✓`, `✕`
- **Most Popular Labels**: "YES", "NO", "Depends on", "Leads to", "Triggers"

---

## 🚀 **Future Enhancements**

### **Phase 2 (Planned)**
- [ ] Edge label positioning (start, middle, end)
- [ ] Edge color picker
- [ ] Edge thickness/style control
- [ ] Custom icon upload
- [ ] Edge label search/filter
- [ ] Edge templates (save favorite combinations)

### **Phase 3 (Advanced)**
- [ ] Multi-line edge labels
- [ ] Edge label tooltips (hover for more info)
- [ ] Edge label icons + text combined
- [ ] AI-suggested labels based on node content
- [ ] Edge label animations
- [ ] Edge label click actions (open modal, navigate, etc.)

---

## 🎨 **Design Principles**

1. **Visual First**: Icons are processed faster than text
2. **Scannable**: Grid layout for quick browsing
3. **Categorized**: Organized by use case, not alphabetically
4. **Consistent**: Same icon/label means the same thing everywhere
5. **Accessible**: High contrast, clear labels, keyboard navigable

---

## 📝 **Technical Details**

### **Implementation**
- **Icons**: Powered by `@iconify/react` (Tabler Icons set)
- **Labels**: React Flow native `label` property
- **Storage**: Stored in edge data, persists in document JSON
- **Rendering**: React Flow handles label positioning automatically

### **Performance**
- **Icon Loading**: Lazy-loaded from Iconify CDN
- **Label Rendering**: SVG text elements, no performance impact
- **Memory**: ~50 bytes per labeled edge

### **Browser Support**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 🎓 **Learning Resources**

- [React Flow Edge Documentation](https://reactflow.dev/api-reference/types/edge)
- [Iconify Icon Sets](https://icon-sets.iconify.design/)
- [Diagram Best Practices](https://www.visual-paradigm.com/tutorials/diagram-best-practices.jsp)
- [Flowchart Symbols Guide](https://www.lucidchart.com/pages/flowchart-symbols-meaning-explained)

---

## 💬 **Feedback & Suggestions**

Have ideas for new icons or labels? Want a specific category?
- Open an issue on GitHub
- Suggest in team chat
- Add to the backlog

**Most Requested:**
- More emoji options
- Custom icon upload
- Edge label templates
- Color-coded edges by type

