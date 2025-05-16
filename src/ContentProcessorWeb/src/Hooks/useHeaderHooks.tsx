import React, { useEffect, useCallback, useState } from "react";
import {
  Avatar,
  Subtitle2,
  Tag,
} from "@fluentui/react-components";
import { Link } from "react-router-dom";

// Header Hooks
interface HeaderHooksProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export const useHeaderHooks = ({ toggleTheme, isDarkMode }: HeaderHooksProps) => {
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl+D");

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "d") {
        toggleTheme();
        event.preventDefault(); // Prevent browser's default action (bookmarking)
        event.stopPropagation(); // Stop further propagation
      }
    },
    [toggleTheme]
  );

  useEffect(() => {
    const isMac = navigator.platform.toLowerCase().includes("mac");
    setShortcutLabel(isMac ? "⌘+D" : "Ctrl+D");

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return {
    shortcutLabel,
  };
};

// Header Component
interface HeaderProps {
  avatarSrc: string;
  title: string;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode; // All child elements, including navigation and tools
}

export const Header: React.FC<HeaderProps> = ({
  avatarSrc,
  title,
  subtitle,
  badge,
  children,
}) => {
  return (
    <header>
      {/* Title Section */}
      <Link to="/default" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="headerTitle">
        <Avatar
          image={{ src: avatarSrc }}
          shape="square"
          //color= {null}
        
        />
        <div className="headerTitleText">
        <Subtitle2 style={{ whiteSpace: "nowrap" }}>
          {title}
          {subtitle && <span style={{ fontWeight: 400 }}> | {subtitle}</span>}
        </Subtitle2>
        {badge && (
          <Tag size="small" style={{ marginTop: 4, marginLeft: '6px' }}>
            {badge}
          </Tag>
        )}
        </div>

      </div>
      </Link>

      {/* Dynamic Content */}
      {children}
    </header>
  );
};
