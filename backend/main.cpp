#include "imgui/imgui.h"
#include "imgui/backends/imgui_impl_glfw.h"
#include "imgui/backends/imgui_impl_opengl3.h"
#include <imgui_internal.h>
#include <X11/X.h>
#include <X11/Xatom.h>
#include <GLFW/glfw3.h>
#include <iostream>
#include <X11/Xlib.h>
#include <nlohmann/json.hpp>

#define GLFW_EXPOSE_NATIVE_X11
#include <GLFW/glfw3native.h>

#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

static const char *GamescopeOverlayProperty = "GAMESCOPE_EXTERNAL_OVERLAY";

struct Widget {
    std::string id;
    std::string type;
    std::string content;
    int width;
    int height;
    float verticalAnchor;
    float horizontalAnchor;
    int xOffset;
    int yOffset;
    ImU32 color = 0xFFFFFFFF;
    ImU32 bgColor;
    GLuint texture;
};

static bool loadTextureFromFile(const char* filename, GLuint* out_texture, int* out_width, int* out_height) {
    // Load from file
    int image_width = 0;
    int image_height = 0;
    unsigned char* image_data = stbi_load(filename, &image_width, &image_height, nullptr, 4);
    if (image_data == nullptr)
        return false;

    // Create a OpenGL texture identifier
    GLuint image_texture;
    glGenTextures(1, &image_texture);
    glBindTexture(GL_TEXTURE_2D, image_texture);

    // Setup filtering parameters for display
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE); // This is required on WebGL for non power-of-two textures
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE); // Same

    // Upload pixels into texture
#if defined(GL_UNPACK_ROW_LENGTH) && !defined(__EMSCRIPTEN__)
    glPixelStorei(GL_UNPACK_ROW_LENGTH, 0);
#endif
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, image_width, image_height, 0, GL_RGBA, GL_UNSIGNED_BYTE, image_data);
    stbi_image_free(image_data);

    *out_texture = image_texture;
    *out_width = image_width;
    *out_height = image_height;

    return true;
}

static ImU32 convertColor(const std::vector<float> &components) {
    return ImGui::ColorConvertFloat4ToU32({components[0], components[1], components[2], components[3]});
}

int main(int argc, const char *args[]) {
    glfwInit();

    const char* glsl_version = "#version 130";
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 0);
    glfwWindowHint(GLFW_RESIZABLE, 1);
    glfwWindowHint(GLFW_TRANSPARENT_FRAMEBUFFER, 1);

    GLFWwindow *window = glfwCreateWindow(1280, 800, "SDH-TestOverlay overlay window", nullptr, nullptr);
    Display *x11_display = glfwGetX11Display();
    Window x11_window = glfwGetX11Window(window);
    if (x11_window && x11_display) {
        // Set atom for gamescope to render as an overlay.
        Atom overlay_atom = XInternAtom (x11_display, GamescopeOverlayProperty, False);
        uint32_t value = 1;
        XChangeProperty(x11_display, x11_window, overlay_atom, XA_CARDINAL, 32, PropertyNewValue, (unsigned char *)&value, 1);
    }

    glfwMakeContextCurrent(window);
    glfwSwapInterval(1); // Enable vsync
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO(); (void)io;
    io.IniFilename = nullptr;
    ImGui::StyleColorsDark();
    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init(glsl_version);

    if (argc != 2) {
        std::cout << "Invalid arguments " << argc << std::endl;
        return -1;
    }

    std::vector<Widget> widgets;
    auto json = nlohmann::json::parse(args[1]);
    for (const auto &entry: json) {
        try {
            Widget widget{};
            entry["id"].get_to(widget.id);
            entry["type"].get_to(widget.type);
            entry["content"].get_to(widget.content);
            entry["width"].get_to(widget.width);
            entry["height"].get_to(widget.height);
            if (entry.contains("vertical_anchor"))
                entry["vertical_anchor"].get_to(widget.verticalAnchor);
            if (entry.contains("horizontal_anchor"))
                entry["horizontal_anchor"].get_to(widget.horizontalAnchor);
            if (entry.contains("x_offset"))
                entry["x_offset"].get_to(widget.xOffset);
            if (entry.contains("y_offset"))
                entry["y_offset"].get_to(widget.yOffset);
            if (entry.contains("color"))
                widget.color = convertColor(entry["color"].get<std::vector<float>>());
            if (entry.contains("bg_color"))
                widget.bgColor = convertColor(entry["bg_color"].get<std::vector<float>>());
            if (widget.type == "image") {
                int width, height;
                if (!loadTextureFromFile(widget.content.c_str(), &widget.texture, &width, &height)) {
                    std::cout << "Warning: Failed to load image: '" << widget.content << "'" << std::endl;
                    continue;
                }
            }
            widgets.push_back(widget);
        } catch (const nlohmann::detail::type_error &e) {
            std::cout << "Warning: Failed to parse widget: '" << entry << "': " << e.what() << std::endl;
        }
    }

    while (!glfwWindowShouldClose(window)) {
        const auto monitor = glfwGetPrimaryMonitor();
        int windowX, windowY, windowHeight, windowWidth;
        glfwGetMonitorWorkarea(monitor, &windowX, &windowY, &windowWidth, &windowHeight);
        glfwSetWindowSize(window, windowWidth, windowHeight);

        glfwPollEvents();

        ImGui_ImplGlfw_NewFrame();
        ImGui_ImplOpenGL3_NewFrame();
        ImGui::NewFrame();

        ImGui::PushStyleVar(ImGuiStyleVar_WindowBorderSize, 0.0f);
        ImGui::PushStyleVar(ImGuiStyleVar_WindowPadding, {0.0f, 0.0f});

        for (const auto &widget: widgets) {
            ImGui::SetNextWindowPos({
                (float)widget.xOffset + widget.horizontalAnchor * (float)windowWidth,
                (float)widget.yOffset + widget.verticalAnchor * (float)windowHeight
            });
            ImGui::SetNextWindowSize({(float)widget.width, (float)widget.height});
            ImGui::PushStyleColor(ImGuiCol_WindowBg, widget.bgColor);
            ImGui::PushStyleColor(ImGuiCol_Text, widget.color);
            ImGui::Begin(widget.id.c_str(), nullptr, ImGuiWindowFlags_NoCollapse | ImGuiWindowFlags_NoDecoration);
            if (widget.type == "image")
                ImGui::Image((void*)(intptr_t)widget.texture, {(float)widget.width, (float)widget.height}, {0, 0}, {1, 1}, ImGui::ColorConvertU32ToFloat4(widget.color));
            else if (widget.type == "text")
                ImGui::TextWrapped("%s", widget.content.c_str());
            ImGui::PopStyleColor(2);
            ImGui::End();
        }

        ImGui::PopStyleVar(2);

        ImGui::Render();
        glEnable(GL_DEPTH_TEST);
        glEnable(GL_BLEND);
        glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
        glClearColor(0, 0, 0, 0);
        glClear(GL_COLOR_BUFFER_BIT);
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
        glfwSwapBuffers(window);
    }

    return 0;
}
