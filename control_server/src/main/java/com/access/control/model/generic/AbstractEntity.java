package com.access.control.model.generic;

import javax.persistence.*;

@MappedSuperclass
public class AbstractEntity {

    /**
     * Path separator for hibernate aliases. Value: {@value DOT}
     */
    protected static final String DOT = ".";

    @Id
    @GeneratedValue(strategy= GenerationType.AUTO)
    @Column(name = "id")
    private Long id;
    public static final String ID = "id";

    private Integer state;

    public Integer getState() {
        return state;
    }

    public void setState(Integer state) {
        this.state = state;
    }

    /**
     * @param id
     *            the id to set
     */
    public void setId(final Long id) {
        this.id = id;
    }

    /**
     * @return the id
     */
    public Long getId() {
        return id;
    }

    /**
     * Generate path from properties list.
     *
     * @param properties
     *            hierarchy of a property
     * @return String representation of property path that looks like "property1.property2.property3"
     */
    public static String path(final String... properties) {
        StringBuilder pathBuilder = new StringBuilder();

        for (String string : properties) {
            pathBuilder.append(string).append(DOT);
        }
        String path = pathBuilder.toString();

        return path.substring(0, path.length() - 1);
    }
}

