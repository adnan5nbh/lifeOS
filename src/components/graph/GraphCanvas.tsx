"use client";

import { useEffect, useRef } from "react";
import { GraphNode, GraphEdge, GraphCluster, NODE_COLORS, FilterState } from "@/lib/graph/types";

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
  filter: FilterState;
  timeFilter: string | null;
  selectedNodeId: string | null;
  onNodeClick: (node: GraphNode) => void;
}

// Preserve positions across re-renders so nodes don't jump
const positionCache = new Map<string, { x: number; y: number }>();

export default function GraphCanvas({
  nodes, edges, clusters, filter, timeFilter, selectedNodeId, onNodeClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onClickRef = useRef(onNodeClick);
  useEffect(() => { onClickRef.current = onNodeClick; }, [onNodeClick]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    let cancelled = false;

    import("d3").then((d3) => {
      if (cancelled || !svgRef.current) return;

      // Filter nodes by time and type
      const cutoff = timeFilter ? new Date(timeFilter + "-28T23:59:59Z") : null;
      const visibleNodes: GraphNode[] = nodes.filter(n => {
        if (filter.types.length > 0 && !filter.types.includes(n.type)) return false;
        if (cutoff && n.created_at && new Date(n.created_at) > cutoff) return false;
        return true;
      });
      const visibleIds = new Set(visibleNodes.map(n => n.id));
      const visibleEdges: GraphEdge[] = edges.filter(e => {
        const s = typeof e.source === "string" ? e.source : (e.source as GraphNode).id;
        const t = typeof e.target === "string" ? e.target : (e.target as GraphNode).id;
        return visibleIds.has(s) && visibleIds.has(t);
      });

      const rect = svg.getBoundingClientRect();
      const W = rect.width || 800;
      const H = rect.height || 600;
      const cx = W / 2;
      const cy = H / 2;

      // Clear previous render
      d3.select(svg).selectAll("*").remove();

      const svgSel = d3.select(svg)
        .attr("width", W).attr("height", H)
        .style("background", "#000010");

      // Defs: glow filters and gradients
      const defs = svgSel.append("defs");
      defs.append("radialGradient").attr("id", "bg-glow")
        .selectAll("stop")
        .data([
          { offset: "0%", color: "#0f0f2a", opacity: 1 },
          { offset: "100%", color: "#000010", opacity: 1 },
        ])
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

      ["you","activity","emotion","person","concept","anxiety","achievement","place"].forEach(type => {
        const color = NODE_COLORS[type as keyof typeof NODE_COLORS] || "#fff";
        const f = defs.append("filter").attr("id", `glow-${type}`).attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
        f.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", type === "you" ? 8 : 4).attr("result", "blur");
        const merge = f.append("feMerge");
        merge.append("feMergeNode").attr("in", "blur");
        merge.append("feMergeNode").attr("in", "SourceGraphic");
        // Colorize
        defs.select(`#glow-${type}`).append("feColorMatrix")
          .attr("in", "blur").attr("type", "matrix")
          .attr("values", `0 0 0 0 ${parseInt(color.slice(1,3),16)/255} 0 0 0 0 ${parseInt(color.slice(3,5),16)/255} 0 0 0 0 ${parseInt(color.slice(5,7),16)/255} 0 0 0 0.6 0`)
          .attr("result", "colorBlur");
        const m2 = defs.select(`#glow-${type} feMerge`);
        m2.insert("feMergeNode", ":first-child").attr("in", "colorBlur");
      });

      // Background gradient
      svgSel.append("rect").attr("width", W).attr("height", H).attr("fill", "url(#bg-glow)");

      // Stars background
      const stars = d3.range(180).map(() => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.2 + 0.3,
        o: Math.random() * 0.5 + 0.2,
      }));
      svgSel.selectAll(".star").data(stars).enter().append("circle")
        .attr("class", "star").attr("cx", d => d.x).attr("cy", d => d.y)
        .attr("r", d => d.r).attr("fill", "white").attr("opacity", d => d.o);

      const container = svgSel.append("g");

      // Zoom + pan
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.15, 5])
        .on("zoom", (event) => container.attr("transform", event.transform.toString()));
      svgSel.call(zoom);

      // Synthetic "You" node
      const youNode: GraphNode = { id: "__you__", label: "You", type: "you" as GraphNode["type"], weight: 10, fx: cx, fy: cy };
      const allNodes: GraphNode[] = [youNode, ...visibleNodes.map(n => {
        const pos = positionCache.get(n.id);
        return { ...n, x: pos?.x ?? cx + (Math.random() - 0.5) * 200, y: pos?.y ?? cy + (Math.random() - 0.5) * 200 };
      })];

      const edgesForSim = visibleEdges.map(e => ({
        ...e,
        source: typeof e.source === "string" ? e.source : (e.source as GraphNode).id,
        target: typeof e.target === "string" ? e.target : (e.target as GraphNode).id,
      }));

      // Cluster hull paths (drawn behind nodes)
      const clusterPaths = container.selectAll<SVGPathElement, GraphCluster>(".cluster-hull")
        .data(clusters).enter().append("path")
        .attr("class", "cluster-hull")
        .attr("fill", d => d.color + "18")
        .attr("stroke", d => d.color + "55")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4");

      // Links
      const link = container.selectAll<SVGLineElement, GraphEdge>(".link")
        .data(edgesForSim).enter().append("line")
        .attr("class", "link")
        .attr("stroke", d => `rgba(148,163,184,${0.1 + d.strength * 0.5})`)
        .attr("stroke-width", d => 0.5 + d.strength * 2);

      // Node groups
      const nodeG = container.selectAll<SVGGElement, GraphNode>(".node")
        .data(allNodes, d => d.id).enter().append("g")
        .attr("class", "node")
        .style("cursor", d => d.id === "__you__" ? "default" : "pointer")
        .call(
          d3.drag<SVGGElement, GraphNode>()
            .on("start", (event, d) => {
              if (!event.active) sim.alphaTarget(0.3).restart();
              if (d.id !== "__you__") { d.fx = d.x; d.fy = d.y; }
            })
            .on("drag", (event, d) => {
              if (d.id !== "__you__") { d.fx = event.x; d.fy = event.y; }
            })
            .on("end", (event, d) => {
              if (!event.active) sim.alphaTarget(0);
              if (d.id !== "__you__") {
                positionCache.set(d.id, { x: d.x ?? cx, y: d.y ?? cy });
                d.fx = null; d.fy = null;
              }
            })
        )
        .on("click", (event, d) => {
          event.stopPropagation();
          if (d.id !== "__you__") onClickRef.current(d);
        });

      // Node circles
      nodeG.append("circle")
        .attr("r", d => {
          if (d.id === "__you__") return 28;
          return Math.max(8, Math.min(24, 8 + Math.sqrt(d.weight) * 3));
        })
        .attr("fill", d => NODE_COLORS[d.id === "__you__" ? "you" : d.type] ?? "#6366f1")
        .attr("fill-opacity", d => d.id === "__you__" ? 0.95 : 0.8)
        .attr("filter", d => `url(#glow-${d.id === "__you__" ? "you" : d.type})`)
        .attr("stroke", d => d.id === selectedNodeId ? "#fff" : "none")
        .attr("stroke-width", 2.5);

      // "You" ring
      nodeG.filter(d => d.id === "__you__").append("circle")
        .attr("r", 38).attr("fill", "none")
        .attr("stroke", NODE_COLORS.you).attr("stroke-width", 1).attr("stroke-opacity", 0.4)
        .attr("stroke-dasharray", "4,3");

      // Labels
      nodeG.append("text")
        .text(d => d.label)
        .attr("text-anchor", "middle")
        .attr("dy", d => {
          const r = d.id === "__you__" ? 28 : Math.max(8, Math.min(24, 8 + Math.sqrt(d.weight) * 3));
          return r + 13;
        })
        .attr("font-size", d => d.id === "__you__" ? "11px" : "9px")
        .attr("fill", d => d.id === "__you__" ? NODE_COLORS.you : "#94a3b8")
        .attr("pointer-events", "none");

      function polygonPath(points: [number, number][]): string {
        return "M" + points.map(p => p.join(",")).join("L") + "Z";
      }

      // Force simulation
      const sim = d3.forceSimulation<GraphNode>(allNodes)
        .force("link", d3.forceLink<GraphNode, GraphEdge>(edgesForSim as unknown as GraphEdge[])
          .id(d => d.id)
          .distance(d => 80 + (1 - (d as unknown as { strength: number }).strength) * 60)
          .strength(d => (d as unknown as { strength: number }).strength * 0.4))
        .force("charge", d3.forceManyBody<GraphNode>().strength(-250))
        .force("center", d3.forceCenter<GraphNode>(cx, cy).strength(0.05))
        .force("collision", d3.forceCollide<GraphNode>().radius(d =>
          Math.max(10, Math.min(26, 8 + Math.sqrt(d.weight) * 3)) + 8))
        .on("tick", () => {
          link
            .attr("x1", d => (d.source as unknown as GraphNode).x ?? 0)
            .attr("y1", d => (d.source as unknown as GraphNode).y ?? 0)
            .attr("x2", d => (d.target as unknown as GraphNode).x ?? 0)
            .attr("y2", d => (d.target as unknown as GraphNode).y ?? 0);

          nodeG.attr("transform", d => `translate(${d.x ?? 0},${d.y ?? 0})`);

          // Update cluster hulls
          clusterPaths.attr("d", (cluster) => {
            const clusterNodes = allNodes.filter(n => cluster.node_ids.includes(n.id));
            if (clusterNodes.length < 3) return null;
            const hull = d3.polygonHull(clusterNodes.map(n => [n.x ?? 0, n.y ?? 0] as [number, number]));
            if (!hull) return null;
            const padded = hull.map(p => {
              const dx = p[0] - cx; const dy = p[1] - cy;
              const len = Math.sqrt(dx*dx+dy*dy) || 1;
              return [p[0] + dx/len*22, p[1] + dy/len*22] as [number, number];
            });
            return polygonPath(padded);
          });
        });

      // Cluster labels (positioned at centroid)
      const clusterLabels = container.selectAll(".cluster-label")
        .data(clusters).enter().append("text")
        .attr("class", "cluster-label")
        .text(d => d.label)
        .attr("fill", d => d.color)
        .attr("font-size", "9px")
        .attr("font-weight", "600")
        .attr("text-anchor", "middle")
        .attr("opacity", 0.8)
        .attr("pointer-events", "none");

      // Update cluster label positions on tick
      sim.on("tick.labels", () => {
        clusterLabels.attr("x", (cluster) => {
          const ns = allNodes.filter(n => cluster.node_ids.includes(n.id));
          return ns.length > 0 ? ns.reduce((s, n) => s + (n.x ?? 0), 0) / ns.length : 0;
        }).attr("y", (cluster) => {
          const ns = allNodes.filter(n => cluster.node_ids.includes(n.id));
          const minY = Math.min(...ns.map(n => n.y ?? 0));
          return minY - 14;
        });
      });

      // Dimming: unhovered nodes dim on hover
      svgSel.on("click.deselect", () => onClickRef.current = onClickRef.current);

      return () => { cancelled = true; sim.stop(); };
    });

    return () => { cancelled = true; };
  }, [nodes, edges, clusters, filter, timeFilter, selectedNodeId]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ touchAction: "none" }}
    />
  );
}
