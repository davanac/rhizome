/**
 * Component: NetworkChart
 * Description: Renders an interactive network visualization using D3.
 * Displays connections between users and projects with force-directed layout.
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.data - Network data containing nodes and links
 * @param {NetworkNode[]} props.data.nodes - Array of network nodes
 * @param {NetworkLink[]} props.data.links - Array of connections between nodes
 * @returns {JSX.Element} Interactive network visualization
 */
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserProjectGallery } from './UserProjectGallery';
import { NetworkNode, NetworkLink } from '@/types/networkTypes';

interface NetworkChartProps {
  data: {
    nodes: NetworkNode[];
    links: NetworkLink[];
  };
}

export const NetworkChart = ({ data }: NetworkChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    // Create a simulation for positioning nodes with more distributed forces
    const simulation = d3.forceSimulation<NetworkNode>(data.nodes)
      .force("link", d3.forceLink<NetworkNode, NetworkLink>(data.links)
        .id(d => d.id)
        .distance(150)) // Increased distance between linked nodes
      .force("charge", d3.forceManyBody()
        .strength(-800) // Stronger repulsion between nodes
        .distanceMax(width / 2)) // Limit the range of repulsion
      .force("x", d3.forceX(width / 2).strength(0.1)) // Weak force towards horizontal center
      .force("y", d3.forceY(height / 2).strength(0.1)) // Weak force towards vertical center
      .force("collision", d3.forceCollide()
        .radius((d: NetworkNode) => (d.isCollectif ? 70 : 60))
        .strength(0.8)); // Stronger collision avoidance

    // Create links with varying thickness based on collaboration count
    const link = svg.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: NetworkLink) => Math.sqrt((d.collaborationCount || 1)) * 2);

    // Create nodes container
    const node = svg.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add circles to nodes
    node.append("circle")
      .attr("r", (d: NetworkNode) => Math.sqrt(d.value) * (d.isCollectif ? 12 : 10))
      .attr("fill", (d: NetworkNode) => d.isCollectif ? "#9333ea" : "#4f46e5")
      .attr("stroke", (d: NetworkNode) => d.isCollectif ? "#581c87" : "#312e81")
      .attr("stroke-width", 1.5);

    // Add avatars to nodes
    node.append("clipPath")
      .attr("id", (d: NetworkNode) => `clip-${d.id}`)
      .append("circle")
      .attr("r", (d: NetworkNode) => Math.sqrt(d.value) * (d.isCollectif ? 12 : 10));

    node.append("image")
      .attr("xlink:href", (d: NetworkNode) => d.avatar || '')
      .attr("x", (d: NetworkNode) => -Math.sqrt(d.value) * (d.isCollectif ? 12 : 10))
      .attr("y", (d: NetworkNode) => -Math.sqrt(d.value) * (d.isCollectif ? 12 : 10))
      .attr("width", (d: NetworkNode) => Math.sqrt(d.value) * (d.isCollectif ? 24 : 20))
      .attr("height", (d: NetworkNode) => Math.sqrt(d.value) * (d.isCollectif ? 24 : 20))
      .attr("clip-path", (d: NetworkNode) => `url(#clip-${d.id})`);

    // Add name labels
    node.append("text")
      .text((d: NetworkNode) => d.name)
      .attr("x", 0)
      .attr("y", (d: NetworkNode) => Math.sqrt(d.value) * (d.isCollectif ? 14 : 12) + 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#4b5563")
      .style("font-size", (d: NetworkNode) => d.isCollectif ? "14px" : "12px")
      .style("font-weight", (d: NetworkNode) => d.isCollectif ? "600" : "normal");

    // Add click event to nodes
    node.on("click", (event: MouseEvent, d: NetworkNode) => {
      setSelectedNode(d);
      setIsDialogOpen(true);
    });

    // Add hover effect to show collaboration count
    link
      .append("title")
      .text((d: NetworkLink) => `${d.collaborationCount || 1} collaboration${(d.collaborationCount || 1) > 1 ? 's' : ''}`);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (typeof d.source === 'string' ? 0 : (d.source as NetworkNode).x!))
        .attr("y1", d => (typeof d.source === 'string' ? 0 : (d.source as NetworkNode).y!))
        .attr("x2", d => (typeof d.target === 'string' ? 0 : (d.target as NetworkNode).x!))
        .attr("y2", d => (typeof d.target === 'string' ? 0 : (d.target as NetworkNode).y!));

      node.attr("transform", (d: NetworkNode) => `translate(${d.x},${d.y})`);
    });

    // Initialize nodes with random positions
    data.nodes.forEach(node => {
      node.x = Math.random() * width;
      node.y = Math.random() * height;
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <>
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%' }}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedNode?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedNode && (
            <UserProjectGallery userId={selectedNode.id} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};